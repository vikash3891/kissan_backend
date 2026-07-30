import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import storeRepository from '../repositories/store.repository.js';

export const getStoreDetails = asyncHandler(async (req, res) => {
    const store = await storeRepository.getPrimaryStore();
    if (!store) {
        throw new ApiError(404, 'Store details not found');
    }
    return res.status(200).json(new ApiResponse(200, store, 'Store details fetched successfully'));
});

export const updateStoreDetails = asyncHandler(async (req, res) => {
    const store = await storeRepository.getPrimaryStore();
    if (!store) {
        throw new ApiError(404, 'Store details not found');
    }

    const updates = req.body;
    
    // Prevent updating id, created_at, updated_at, media fields directly through this endpoint
    const forbiddenFields = [
        'id', 'created_at', 'updated_at', 
        'logo_url', 'logo_public_id', 'banner_url', 'banner_public_id',
        'invoice_logo_url', 'invoice_logo_public_id', 'email_logo_url', 'email_logo_public_id',
        'favicon_url', 'favicon_public_id'
    ];
    
    for (const field of forbiddenFields) {
        delete updates[field];
    }

    if (Object.keys(updates).length === 0) {
        return res.status(200).json(new ApiResponse(200, store, 'No updates provided'));
    }

    // Build diff for audit log
    const changes = {};
    for (const key of Object.keys(updates)) {
        if (updates[key] !== store[key]) {
            changes[key] = {
                old: store[key],
                new: updates[key]
            };
        }
    }

    const updatedStore = await storeRepository.updateStore(store.id, updates);

    // Log changes if any
    if (Object.keys(changes).length > 0) {
        await storeRepository.logAuditChange(store.id, req.user?.id || null, changes);
    }

    return res.status(200).json(new ApiResponse(200, updatedStore, 'Store details updated successfully'));
});

export const uploadStoreMedia = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const validTypes = ['logo', 'banner', 'invoice_logo', 'email_logo', 'favicon'];
    
    if (!validTypes.includes(type)) {
        throw new ApiError(400, 'Invalid media type');
    }

    if (!req.file) {
        throw new ApiError(400, 'Media file is required');
    }

    const store = await storeRepository.getPrimaryStore();
    if (!store) {
        throw new ApiError(404, 'Store details not found');
    }

    const localFilePath = req.file.path;
    const cloudinaryResponse = await uploadOnCloudinary(localFilePath, 'kisaan_kart/store');

    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }

    if (!cloudinaryResponse) {
        throw new ApiError(500, 'Error uploading media to Cloudinary');
    }

    // Delete old image from cloudinary if it exists
    const oldPublicId = store[`${type}_public_id`];
    if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
    }

    const updatedStore = await storeRepository.updateMediaUrl(
        store.id, 
        type, 
        cloudinaryResponse.secure_url, 
        cloudinaryResponse.public_id
    );

    await storeRepository.logAuditChange(store.id, req.user?.id || null, {
        [type]: { old: oldPublicId ? 'Existed' : 'None', new: 'Uploaded' }
    });

    return res.status(200).json(new ApiResponse(200, updatedStore, `${type} uploaded successfully`));
});

export const deleteStoreMedia = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const validTypes = ['logo', 'banner', 'invoice_logo', 'email_logo', 'favicon'];
    
    if (!validTypes.includes(type)) {
        throw new ApiError(400, 'Invalid media type');
    }

    const store = await storeRepository.getPrimaryStore();
    if (!store) {
        throw new ApiError(404, 'Store details not found');
    }

    const publicId = store[`${type}_public_id`];
    if (!publicId) {
        throw new ApiError(404, `No ${type} found to delete`);
    }

    await deleteFromCloudinary(publicId);
    
    const updatedStore = await storeRepository.clearMediaUrl(store.id, type);

    await storeRepository.logAuditChange(store.id, req.user?.id || null, {
        [type]: { old: 'Existed', new: 'Deleted' }
    });

    return res.status(200).json(new ApiResponse(200, updatedStore, `${type} deleted successfully`));
});

export const getAuditHistory = asyncHandler(async (req, res) => {
    const store = await storeRepository.getPrimaryStore();
    if (!store) {
        throw new ApiError(404, 'Store details not found');
    }

    const logs = await storeRepository.getAuditHistory(store.id);

    return res.status(200).json(new ApiResponse(200, logs, 'Audit history fetched successfully'));
});

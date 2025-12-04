import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContextFirebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { Upload, Loader2, Save, User, Camera } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
    const { logoUrl } = useBranding();
    const { user } = useAuth();

    // Branding State
    const [logoFile, setLogoFile] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Profile State
    const [profileForm, setProfileForm] = useState({
        displayName: '',
        phoneNumber: '',
        photoURL: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm({
                displayName: user.displayName || user.name || '',
                phoneNumber: user.phoneNumber || user.phone || '',
                photoURL: user.photoURL || ''
            });
        }
    }, [user]);

    // Branding Handlers
    const handleLogoFileChange = (e) => {
        if (e.target.files[0]) {
            setLogoFile(e.target.files[0]);
        }
    };

    const handleLogoUpload = async () => {
        if (!logoFile) return;
        setUploadingLogo(true);

        try {
            const storageRef = ref(storage, `branding/logo/${Date.now()}_${logoFile.name}`);
            await uploadBytes(storageRef, logoFile);
            const downloadURL = await getDownloadURL(storageRef);

            await setDoc(doc(db, 'settings', 'branding'), {
                logoUrl: downloadURL,
                updatedAt: new Date().toISOString(),
                updatedBy: user.email
            });

            toast.success('Logo updated successfully!');
            setLogoFile(null);
        } catch (error) {
            console.error("Error uploading logo:", error);
            toast.error('Failed to update logo.');
        } finally {
            setUploadingLogo(false);
        }
    };

    // Profile Handlers
    const handleProfileChange = (field, value) => {
        setProfileForm(prev => ({ ...prev, [field]: value }));
    };

    const handleAvatarChange = (e) => {
        if (e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileForm(prev => ({ ...prev, photoURL: reader.result }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSavingProfile(true);

        try {
            let photoURL = profileForm.photoURL;

            // Upload new avatar if selected
            if (avatarFile) {
                const storageRef = ref(storage, `users/${user.id}/profile_${Date.now()}`);
                await uploadBytes(storageRef, avatarFile);
                photoURL = await getDownloadURL(storageRef);
            }

            // Update Firestore
            await updateDoc(doc(db, 'users', user.id), {
                displayName: profileForm.displayName,
                name: profileForm.displayName, // Keep both for compatibility
                phoneNumber: profileForm.phoneNumber,
                phone: profileForm.phoneNumber,
                photoURL: photoURL,
                updatedAt: new Date().toISOString()
            });

            toast.success('Profile updated successfully!');
            setAvatarFile(null);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error('Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your profile and system preferences</p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="flex items-start gap-8">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                        {profileForm.photoURL ? (
                                            <img
                                                src={profileForm.photoURL}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <User size={40} />
                                            </div>
                                        )}
                                    </div>
                                    <label
                                        htmlFor="avatar-upload"
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                                    >
                                        <Camera size={24} />
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Click to change</p>
                            </div>

                            {/* Profile Fields */}
                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <Input
                                            id="displayName"
                                            value={profileForm.displayName}
                                            onChange={(e) => handleProfileChange('displayName', e.target.value)}
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        <Input
                                            id="phoneNumber"
                                            value={profileForm.phoneNumber}
                                            onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Input
                                            id="role"
                                            value={user?.role || 'User'}
                                            disabled
                                            className="bg-gray-50 capitalize"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={savingProfile}
                                    >
                                        {savingProfile ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Branding Settings (Existing) */}
            <Card>
                <CardHeader>
                    <CardTitle>System Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <Label>Current Logo</Label>
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <img src={logoUrl} alt="Current Logo" className="h-16 object-contain" />
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <Label htmlFor="logo-upload">Upload New Logo</Label>
                                <div className="flex gap-2 mt-1.5">
                                    <Input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoFileChange}
                                        className="cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Recommended size: 200x50px. PNG or SVG preferred.</p>
                            </div>

                            <Button
                                onClick={handleLogoUpload}
                                disabled={!logoFile || uploadingLogo}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {uploadingLogo ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Update Logo
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;

import React, { useState } from 'react';
import { Bell, Check, Settings, X, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './ui/popover';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const NotificationCenter = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, settings, updateSettings } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const navigate = useNavigate();

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'error': return <X className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5 text-gray-600" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={markAllAsRead} title="Mark all as read">
                                    <Check className="h-4 w-4" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSettingsOpen(true)} title="Settings">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="h-[300px]">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                                <Bell className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 items-start",
                                            !notification.read && "bg-blue-50/50"
                                        )}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-sm font-medium leading-none", !notification.read && "text-blue-700")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-500 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </PopoverContent>
            </Popover>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Notification Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="job_created" className="flex-1">
                                New Job Alerts
                                <p className="text-xs text-gray-500 font-normal">Get notified when a new job is created</p>
                            </Label>
                            <Switch
                                id="job_created"
                                checked={settings.job_created}
                                onCheckedChange={(checked) => updateSettings({ ...settings, job_created: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="invoice_paid" className="flex-1">
                                Payment Received
                                <p className="text-xs text-gray-500 font-normal">Get notified when an invoice is paid</p>
                            </Label>
                            <Switch
                                id="invoice_paid"
                                checked={settings.invoice_paid}
                                onCheckedChange={(checked) => updateSettings({ ...settings, invoice_paid: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="job_status_change" className="flex-1">
                                Job Status Updates
                                <p className="text-xs text-gray-500 font-normal">Get notified when job workflow stage changes</p>
                            </Label>
                            <Switch
                                id="job_status_change"
                                checked={settings.job_status_change}
                                onCheckedChange={(checked) => updateSettings({ ...settings, job_status_change: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="stock_alert" className="flex-1">
                                Low Stock Alerts
                                <p className="text-xs text-gray-500 font-normal">Get notified when inventory items run low</p>
                            </Label>
                            <Switch
                                id="stock_alert"
                                checked={settings.stock_alert}
                                onCheckedChange={(checked) => updateSettings({ ...settings, stock_alert: checked })}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default NotificationCenter;

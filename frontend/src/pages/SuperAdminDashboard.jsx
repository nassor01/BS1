import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, FileText, Settings, BarChart3, LogOut, ChevronLeft, ChevronRight, UserCheck, UserX, AlertCircle, Download, Search, X } from 'lucide-react';
import superAdminService from '../services/superAdminService';
import Footer from '../components/layout/Footer';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('admins');
    const [admins, setAdmins] = useState([]);
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [settings, setSettings] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    
    // Pagination for audit logs
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    
    // Modals
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'super_admin') {
            navigate('/login');
            return;
        }
        setCurrentUser(user);
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [adminsRes, usersRes, settingsRes, analyticsRes] = await Promise.all([
                superAdminService.getAdmins(),
                superAdminService.getUsers(),
                superAdminService.getSettings(),
                superAdminService.getAnalytics()
            ]);

            if (adminsRes.ok) setAdmins(await adminsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
            if (settingsRes.ok) setSettings(await settingsRes.json());
            if (analyticsRes.ok) setAnalytics(await analyticsRes.json());

            await fetchAuditLogs();
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async (page = 1) => {
        try {
            const res = await superAdminService.getAuditLogs({ 
                page, 
                limit: 20,
                action: actionFilter || undefined
            });
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data.logs);
                setTotalPages(data.pagination.totalPages);
                setCurrentPage(page);
            }
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        }
    };

    const handlePromote = async (userId) => {
        if (!window.confirm('Are you sure you want to promote this user to admin?')) return;
        
        try {
            const res = await superAdminService.promoteUser(userId);
            if (res.ok) {
                fetchData();
                setShowPromoteModal(false);
                setSelectedUser(null);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to promote user');
            }
        } catch (err) {
            alert('Error promoting user');
        }
    };

    const handleDemote = async (userId) => {
        if (!window.confirm('Are you sure you want to demote this admin to regular user?')) return;
        
        try {
            const res = await superAdminService.demoteAdmin(userId);
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to demote admin');
            }
        } catch (err) {
            alert('Error demoting admin');
        }
    };

    const handleDisable = async (userId) => {
        if (!window.confirm('Are you sure you want to disable this admin account?')) return;
        
        try {
            const res = await superAdminService.disableAdmin(userId);
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to disable admin');
            }
        } catch (err) {
            alert('Error disabling admin');
        }
    };

    const handleEnable = async (userId) => {
        try {
            const res = await superAdminService.enableAdmin(userId);
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to enable admin');
            }
        } catch (err) {
            alert('Error enabling admin');
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => prev.map(s => 
            s.setting_key === key ? { ...s, setting_value: value } : s
        ));
    };

    const handleSaveSettings = async () => {
        try {
            const settingsArray = settings.map(s => ({
                key: s.setting_key,
                value: s.setting_value
            }));
            
            const res = await superAdminService.updateSettings(settingsArray);
            if (res.ok) {
                alert('Settings saved successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save settings');
            }
        } catch (err) {
            alert('Error saving settings');
        }
    };

    const handleExportLogs = async () => {
        try {
            const res = await superAdminService.exportAuditLogs({});
            if (res.ok) {
                const logs = await res.json();
                const csv = [
                    ['ID', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Created At'].join(','),
                    ...logs.map(log => [
                        log.id,
                        log.user_email || 'System',
                        log.action,
                        log.entity_type || '',
                        log.entity_id || '',
                        log.ip_address || '',
                        log.created_at
                    ].join(','))
                ].join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
            }
        } catch (err) {
            alert('Error exporting logs');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString();
    };

    const getSettingValue = (key) => {
        const setting = settings.find(s => s.setting_key === key);
        return setting ? setting.setting_value : '';
    };

    const filteredAdmins = admins.filter(a => 
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-gradient-to-r from-purple-900 to-indigo-900 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                        <Shield className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-none">Super Admin Control Panel</h1>
                        <p className="text-sm text-purple-200">Full System Access</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 border border-white/30 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
                {/* Tabs */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                        <button
                            onClick={() => setActiveTab('admins')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'admins' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Admins
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'audit' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Audit Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                        <p className="text-gray-500">Loading...</p>
                    </div>
                ) : (
                    <>
                        {/* Admins Tab */}
                        {activeTab === 'admins' && (
                            <div className="space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                        <p className="text-sm text-gray-500">Total Admins</p>
                                        <p className="text-3xl font-bold text-gray-900">{admins.filter(a => a.role === 'admin').length}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                        <p className="text-sm text-gray-500">Regular Users</p>
                                        <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                        <p className="text-sm text-gray-500">Disabled Accounts</p>
                                        <p className="text-3xl font-bold text-gray-900">{admins.filter(a => a.locked_until).length}</p>
                                    </div>
                                </div>

                                {/* Admins Table */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-900">Admin Accounts</h3>
                                        <button
                                            onClick={() => setShowPromoteModal(true)}
                                            className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                                        >
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            Promote User
                                        </button>
                                    </div>
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredAdmins.map((admin) => (
                                                <tr key={admin.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.full_name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.email}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {admin.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.locked_until ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                            {admin.locked_until ? 'Disabled' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {admin.role !== 'super_admin' && (
                                                            <>
                                                                {admin.locked_until ? (
                                                                    <button
                                                                        onClick={() => handleEnable(admin.id)}
                                                                        className="text-green-600 hover:text-green-900 mr-3"
                                                                    >
                                                                        Enable
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleDisable(admin.id)}
                                                                        className="text-red-600 hover:text-red-900 mr-3"
                                                                    >
                                                                        Disable
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDemote(admin.id)}
                                                                    className="text-gray-600 hover:text-gray-900"
                                                                >
                                                                    Demote
                                                                </button>
                                                            </>
                                                        )}
                                                        {admin.role === 'super_admin' && admin.id === currentUser?.id && (
                                                            <span className="text-gray-400 text-xs italic">Current session</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Audit Logs Tab */}
                        {activeTab === 'audit' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-900">Audit Logs</h3>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={actionFilter}
                                            onChange={(e) => { setActionFilter(e.target.value); fetchAuditLogs(1); }}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                        >
                                            <option value="">All Actions</option>
                                            <option value="USER_PROMOTED">User Promoted</option>
                                            <option value="ADMIN_DEMOTED">Admin Demoted</option>
                                            <option value="ADMIN_DISABLED">Admin Disabled</option>
                                            <option value="SETTINGS_UPDATED">Settings Updated</option>
                                            <option value="ROOM_DELETED">Room Deleted</option>
                                        </select>
                                        <button
                                            onClick={handleExportLogs}
                                            className="flex items-center px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Export CSV
                                        </button>
                                    </div>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {auditLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(log.created_at)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.user_email || 'System'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {log.entity_type && `${log.entity_type}: ${log.entity_id || '-'}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{log.ip_address || '-'}</td>
                                            </tr>
                                        ))}
                                        {auditLogs.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No audit logs found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {totalPages > 1 && (
                                    <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                                        <button
                                            onClick={() => fetchAuditLogs(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                        </button>
                                        <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                                        <button
                                            onClick={() => fetchAuditLogs(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                                        >
                                            Next <ChevronRight className="w-4 h-4 ml-1" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-6">System Settings</h3>
                                
                                <div className="space-y-8">
                                    {/* Working Hours */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Working Hours</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                                                <input
                                                    type="time"
                                                    value={getSettingValue('working_hours_start')}
                                                    onChange={(e) => handleSettingChange('working_hours_start', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">End Time</label>
                                                <input
                                                    type="time"
                                                    value={getSettingValue('working_hours_end')}
                                                    onChange={(e) => handleSettingChange('working_hours_end', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Booking Rules */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Booking Rules</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Max Days Ahead for Booking</label>
                                                <input
                                                    type="number"
                                                    value={getSettingValue('max_booking_days_ahead')}
                                                    onChange={(e) => handleSettingChange('max_booking_days_ahead', e.target.value)}
                                                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                            </div>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={getSettingValue('enable_multi_date_reservation') === 'true'}
                                                    onChange={(e) => handleSettingChange('enable_multi_date_reservation', e.target.checked.toString())}
                                                    className="w-4 h-4 rounded border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700">Enable Multi-Date Reservations</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={getSettingValue('require_email_verification') === 'true'}
                                                    onChange={(e) => handleSettingChange('require_email_verification', e.target.checked.toString())}
                                                    className="w-4 h-4 rounded border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700">Require Email Verification</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Maintenance Mode */}
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className="w-5 h-5 text-amber-600" />
                                            <h4 className="text-sm font-semibold text-amber-800">Maintenance Mode</h4>
                                        </div>
                                        <p className="text-sm text-amber-700 mb-3">When enabled, users will not be able to make bookings.</p>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={getSettingValue('maintenance_mode') === 'true'}
                                                onChange={(e) => handleSettingChange('maintenance_mode', e.target.checked.toString())}
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm font-medium text-amber-800">Enable Maintenance Mode</span>
                                        </label>
                                    </div>

                                    <button
                                        onClick={handleSaveSettings}
                                        className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Analytics Tab */}
                        {activeTab === 'analytics' && analytics && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                        <p className="text-sm text-gray-500">Total Users</p>
                                        <p className="text-3xl font-bold text-gray-900">{analytics.users.total_users}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                        <p className="text-sm text-gray-500">Total Bookings</p>
                                        <p className="text-3xl font-bold text-gray-900">{analytics.bookings.total_bookings}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                        <p className="text-sm text-gray-500">Total Rooms</p>
                                        <p className="text-3xl font-bold text-gray-900">{analytics.rooms.total_rooms}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                        <p className="text-sm text-gray-500">New Users (30d)</p>
                                        <p className="text-3xl font-bold text-gray-900">{analytics.users.new_users_30d}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="font-semibold text-gray-900 mb-4">Booking Status</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Pending</span>
                                                <span className="font-bold text-yellow-600">{analytics.bookings.pending_bookings}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Confirmed</span>
                                                <span className="font-bold text-green-600">{analytics.bookings.confirmed_bookings}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Rejected</span>
                                                <span className="font-bold text-red-600">{analytics.bookings.rejected_bookings}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="font-semibold text-gray-900 mb-4">Recent Activity (7 days)</h3>
                                        <div className="space-y-2">
                                            {analytics.recentActivity.map((item, i) => (
                                                <div key={i} className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">{item.action}</span>
                                                    <span className="font-bold text-gray-900">{item.count}</span>
                                                </div>
                                            ))}
                                            {analytics.recentActivity.length === 0 && (
                                                <p className="text-sm text-gray-400">No recent activity</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Promote User Modal */}
                {showPromoteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/40" onClick={() => setShowPromoteModal(false)}></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Promote User to Admin</h3>
                                <button onClick={() => setShowPromoteModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                            
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>

                            <div className="max-h-80 overflow-y-auto space-y-2">
                                {filteredUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={() => handlePromote(user.id)}
                                            className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                                        >
                                            Promote
                                        </button>
                                    </div>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <p className="text-center text-gray-500 py-8">No users found</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default SuperAdminDashboard;

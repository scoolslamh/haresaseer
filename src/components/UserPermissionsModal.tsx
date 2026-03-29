import React, { useState, useEffect } from 'react';
import { UserWithPermissions, Permission, PermissionModule, PERMISSION_GROUPS } from '../types/permissions';
import { PermissionService } from '../services/permissionService';
import { X, Save, Shield, Check, Users, Settings, AlertTriangle } from 'lucide-react';

interface UserPermissionsModalProps {
  user: UserWithPermissions;
  permissions: Permission[];
  onSubmit: (userId: string, permissionIds: string[]) => Promise<void>;
  onClose: () => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  user,
  permissions,
  onSubmit,
  onClose
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionModules, setPermissionModules] = useState<PermissionModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'individual' | 'groups'>('groups');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const modules = await PermissionService.getPermissionsByModule();
      setPermissionModules(modules);
      console.log('✅ تم تحميل وحدات الصلاحيات في UserPermissionsModal:', modules); // أضف هذا السطر
      
      // تعيين الصلاحيات الحالية للمستخدم
      const currentPermissionIds = user.permissions.map(p => p.id);
      setSelectedPermissions(currentPermissionIds);
      console.log('✅ الصلاحيات الحالية للمستخدم عند فتح المودال:', currentPermissionIds); // أضف هذا السطر
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في تحميل البيانات');
      console.error('❌ خطأ في تحميل بيانات الصلاحيات في المودال:', err); // أضف هذا السطر
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      await onSubmit(user.id, selectedPermissions);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في حفظ الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => {
      const newPermissions = prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];
      console.log('🔄 تبديل صلاحية:', permissionId, 'الحالة الجديدة:', newPermissions); // أضف هذا السطر
      return newPermissions;
    });
  };

  const handleModuleToggle = (module: PermissionModule) => {
    const modulePermissionIds = module.permissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      // إلغاء تحديد جميع صلاحيات الوحدة
      setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)));
    } else {
      // تحديد جميع صلاحيات الوحدة
      setSelectedPermissions(prev => {
        const newPermissions = [...prev];
        modulePermissionIds.forEach(id => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id);
          }
        });
        return newPermissions;
      });
    }
  };

  const handleGroupToggle = (group: any) => {
    const groupPermissions = permissions.filter(p => group.permissions.includes(p.name));
    const groupPermissionIds = groupPermissions.map(p => p.id);
    const allSelected = groupPermissionIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      // إلغاء تحديد المجموعة
      setSelectedPermissions(prev => prev.filter(id => !groupPermissionIds.includes(id)));
    } else {
      // تحديد المجموعة
      setSelectedPermissions(prev => {
        const newPermissions = [...prev];
        groupPermissionIds.forEach(id => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id);
          }
        });
        return newPermissions;
      });
    }
  };

  const isGroupSelected = (group: any) => {
    const groupPermissions = permissions.filter(p => group.permissions.includes(p.name));
    const groupPermissionIds = groupPermissions.map(p => p.id);
    return groupPermissionIds.length > 0 && groupPermissionIds.every(id => selectedPermissions.includes(id));
  };

  const isGroupPartiallySelected = (group: any) => {
    const groupPermissions = permissions.filter(p => group.permissions.includes(p.name));
    const groupPermissionIds = groupPermissions.map(p => p.id);
    const selectedCount = groupPermissionIds.filter(id => selectedPermissions.includes(id)).length;
    return selectedCount > 0 && selectedCount < groupPermissionIds.length;
  };

  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case 'guards': return <Users className="w-5 h-5" />;
      case 'schools': return <Settings className="w-5 h-5" />;
      case 'operations': return <Settings className="w-5 h-5" />;
      case 'violations': return <AlertTriangle className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">إدارة صلاحيات المستخدم</h2>
              <p className="text-sm text-gray-600">{user.full_name} (@{user.username})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'groups'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              مجموعات الصلاحيات
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('individual')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'individual'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              صلاحيات مفصلة
            </button>
          </div>

          {/* Permission Groups Tab */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="bg-moe-50 p-4 rounded-lg mb-4">
                <p className="text-moe-800 text-sm">
                  <strong>مجموعات الصلاحيات:</strong> اختر مجموعة جاهزة من الصلاحيات حسب دور المستخدم
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PERMISSION_GROUPS.map(group => (
                  <div
                    key={group.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isGroupSelected(group)
                        ? 'border-purple-500 bg-purple-50'
                        : isGroupPartiallySelected(group)
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleGroupToggle(group)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                            isGroupSelected(group)
                              ? 'bg-purple-600 border-purple-600'
                              : isGroupPartiallySelected(group)
                              ? 'bg-yellow-500 border-yellow-500'
                              : 'border-gray-300'
                          }`}>
                            {(isGroupSelected(group) || isGroupPartiallySelected(group)) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <h3 className="font-medium text-gray-800">{group.display_name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                        <p className="text-xs text-gray-500">
                          {group.permissions.length} صلاحية
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Permissions Tab */}
          {activeTab === 'individual' && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 text-sm">
                  <strong>صلاحيات مفصلة:</strong> اختر صلاحيات محددة لكل وحدة في النظام
                </p>
              </div>

              {permissionModules.map(module => {
                const modulePermissionIds = module.permissions.map(p => p.id);
                const selectedCount = modulePermissionIds.filter(id => selectedPermissions.includes(id)).length;
                const allSelected = selectedCount === modulePermissionIds.length;
                const partiallySelected = selectedCount > 0 && selectedCount < modulePermissionIds.length;

                return (
                  <div key={module.name} className="border rounded-lg overflow-hidden">
                    <div
                      className={`p-4 cursor-pointer transition-colors ${
                        allSelected
                          ? 'bg-purple-100 border-b border-purple-200'
                          : partiallySelected
                          ? 'bg-yellow-100 border-b border-yellow-200'
                          : 'bg-gray-50 border-b border-gray-200'
                      }`}
                      onClick={() => handleModuleToggle(module)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                            allSelected
                              ? 'bg-purple-600 border-purple-600'
                              : partiallySelected
                              ? 'bg-yellow-500 border-yellow-500'
                              : 'border-gray-300'
                          }`}>
                            {(allSelected || partiallySelected) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          {getModuleIcon(module.name)}
                          <h3 className="text-lg font-semibold text-gray-800">{module.display_name}</h3>
                        </div>
                        <span className="text-sm text-gray-600">
                          {selectedCount}/{modulePermissionIds.length} محدد
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {module.permissions.map(permission => (
                        <div
                          key={permission.id}
                          className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => handlePermissionToggle(permission.id)}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center mt-0.5 ${
                            selectedPermissions.includes(permission.id)
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-gray-300'
                          }`}>
                            {selectedPermissions.includes(permission.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{permission.display_name}</h4>
                            {permission.description && (
                              <p className="text-sm text-gray-600">{permission.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">إجمالي الصلاحيات المحددة:</span>
              <span className="text-lg font-bold text-purple-600">{selectedPermissions.length}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {loading ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

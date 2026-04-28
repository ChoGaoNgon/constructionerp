'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Filter, UserPlus } from 'lucide-react';
import NavigationLayout from '@/components/NavigationLayout';
import { cn } from '@/lib/utils';

export default function PersonnelPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('users').select('*');
      if (data) setUsers(data);
    }
    fetchData();
  }, []);

  return (
    <NavigationLayout activeTab="personnel">
      <div className="space-y-8 animate-in slide-in-from-top duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-primary tracking-tight">Danh bạ nhân sự</h2>
            <p className="text-on-surface-variant mt-1">Quản lý đội ngũ tại công trường và các vai trò hành chính.</p>
          </div>
          <button className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Thêm nhân sự
          </button>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Họ tên</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Vai trò</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-bold text-primary">{u.name}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                      u.role === 'BCH' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{u.email}</td>
                  <td className="px-6 py-4 text-right text-xs font-medium text-on-surface-variant">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </NavigationLayout>
  );
}

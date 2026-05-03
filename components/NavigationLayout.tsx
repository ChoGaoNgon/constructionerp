'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Rocket, FileText, Users, Settings, Search, Bell, HelpCircle, Download, LogOut, Briefcase, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function NavigationLayout({ children, activeTab }: { children: React.ReactNode, activeTab: string }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Updated to use 'employees' table
        const { data: profile } = await supabase.from('employees').select('*').eq('id', session.user.id).single();
        if (profile) setCurrentUser(profile);
      }
    }
    getUser();
  }, []);

  const menuSections = [
    {
      label: 'Hệ thống',
      items: [
        { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard, href: '/dashboard' },
        { id: 'profile', label: 'Hồ sơ cá nhân', icon: Users, href: '/profile' },
      ]
    },
    {
      label: 'Tổ chức',
      items: [
        { id: 'departments', label: 'Phòng ban', icon: Settings, href: '/departments' },
        { id: 'personnel', label: 'Nhân sự', icon: Users, href: '/personnel' },
      ]
    },
    {
      label: 'Dự án',
      items: [
        { id: 'projects', label: 'Danh sách dự án', icon: Rocket, href: '/projects' },
        { id: 'project-roles', label: 'Chức danh dự án', icon: Briefcase, href: '/project-roles' },
        { id: 'reports', label: 'Báo cáo định kỳ', icon: FileText, href: '/reports' },
      ]
    },
    {
      label: 'Tài chính',
      items: [
        { id: 'payments', label: 'Thanh toán', icon: DollarSign, href: '/payments' },
      ]
    }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-[240px] h-screen fixed left-0 top-0 border-r border-outline-variant bg-white shadow-sm flex flex-col py-6 z-50">
        <div className="px-6 mb-8 text-center sm:text-left">
          <h1 className="text-xl font-bold tracking-tight text-primary">ProForeman</h1>
          <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mt-1">Bản Supabase</p>
        </div>
        
        <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
          {menuSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <div className="px-6 mb-2">
                <p className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-[0.2em]">{section.label}</p>
              </div>
              {section.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2",
                    activeTab === item.id 
                      ? "text-primary bg-primary/5 border-primary font-bold" 
                      : "text-on-surface-variant border-transparent hover:bg-surface-container-lowest hover:text-primary"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-primary" : "text-on-surface-variant/70")} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-outline-variant">
           <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-error hover:bg-error/5 rounded-lg transition-colors"
           >
              <LogOut className="w-5 h-5" />
              <span>Đăng xuất</span>
           </button>
        </div>
      </aside>

      {/* Top Bar */}
      <header className="fixed top-0 right-0 left-[240px] h-16 z-40 border-b border-outline-variant bg-white/80 backdrop-blur-md flex items-center justify-between px-8">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input 
              type="text" 
              placeholder="Tìm kiếm dữ liệu..." 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-outline-variant pr-6">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-primary leading-none">{currentUser?.name || 'Đang tải...'}</p>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase mt-0.5">{currentUser?.system_role || 'Nhân viên'}</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-surface-container-low bg-surface-container overflow-hidden relative">
             <Image 
               src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
               alt="Profile" 
               fill 
               className="object-cover"
               referrerPolicy="no-referrer"
             />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-[240px] pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

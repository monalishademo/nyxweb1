'use client';

import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/'); // <--- মূল সাইট/হোমপেজে রিডাইরেক্ট করা হলো
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-10 text-white">
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-400">Secret Admin Workspace</h1>
          <p className="text-xs text-gray-400">Protected Control Center</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600/80 hover:bg-red-600 px-4 py-2 text-sm font-semibold transition cursor-pointer"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/50 p-8 text-center text-gray-500">
          আপনার পরবর্তী সিক্রেট টুল বা ইন্টারফেস এখানে যোগ করতে পারবেন।
        </div>
      </div>
    </div>
  );
}
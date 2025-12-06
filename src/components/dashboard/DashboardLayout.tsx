import { Outlet } from 'react-router-dom';

export const DashboardLayout = () => {
  return (
    <div className="bg-muted/30 pt-[104px]">
      <div className="min-h-[calc(100vh-104px)]">
        <main className="p-3 sm:p-4 md:p-6 page-enter w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

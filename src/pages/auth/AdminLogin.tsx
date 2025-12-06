import { LoginForm } from '@/components/auth/LoginForm';
import { Link } from 'react-router-dom';

const AdminLogin = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card p-8 rounded-2xl shadow-2xl">
          <LoginForm role="admin" redirectPath="/admin/dashboard" />
        </div>
        <div className="mt-6 text-center text-sm text-primary-foreground/70">
          <span>Other portals: </span>
          <Link to="/judge" className="text-secondary hover:underline">Judge</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

import { LoginForm } from '@/components/auth/LoginForm';
import { Link } from 'react-router-dom';

const UserLogin = () => {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md border border-border/60 shadow-2xl rounded-3xl p-6">
          <LoginForm role="user" redirectPath="/user/dashboard" />
        </div>
      </div>
    </div>
  );
};

export default UserLogin;

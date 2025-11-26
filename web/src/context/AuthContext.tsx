import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
    currentUser: User | null;
    signUp: (user: User) => boolean;
    signIn: (email: string, password: string) => boolean;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('ushare_current_user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const signUp = (user: User) => {
        const users: User[] = JSON.parse(localStorage.getItem('ushare_users') || '[]');

        if (users.some(u => u.email === user.email)) {
            return false; // User already exists
        }

        users.push(user);
        localStorage.setItem('ushare_users', JSON.stringify(users));

        setCurrentUser(user);
        localStorage.setItem('ushare_current_user', JSON.stringify(user));
        return true;
    };

    const signIn = (email: string, password: string) => {
        const users: User[] = JSON.parse(localStorage.getItem('ushare_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            setCurrentUser(user);
            localStorage.setItem('ushare_current_user', JSON.stringify(user));
            return true;
        }
        return false;
    };

    const signOut = () => {
        setCurrentUser(null);
        localStorage.removeItem('ushare_current_user');
    };

    return (
        <AuthContext.Provider value={{ currentUser, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

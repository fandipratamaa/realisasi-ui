import { User } from '@/types';
import { ROLES, INDIVIDU_ROLES } from '@/constants/roles';

export function canAccessPemda(user: User | null): boolean {
  if (!user) return false;
  return user.roles.includes(ROLES.SUPER_ADMIN);
}

export function canAccessOpd(user: User | null): boolean {
  if (!user) return false;
  return (
    user.roles.includes(ROLES.SUPER_ADMIN) ||
    user.roles.includes(ROLES.ADMIN_OPD) ||
    user.roles.includes(ROLES.LEVEL_1) ||
    user.roles.includes(ROLES.LEVEL_2) ||
    user.roles.includes(ROLES.LEVEL_3) ||
    user.roles.includes(ROLES.LEVEL_4)
  );
}

export function canAccessIndividu(user: User | null): boolean {
  if (!user) return false;
  return (
    user.roles.includes(ROLES.SUPER_ADMIN) ||
    user.roles.includes(ROLES.ADMIN_OPD) ||
    user.roles.some((role) => INDIVIDU_ROLES.includes(role as any))
  );
}

export function canAccessIndividuRenja(user: User | null): boolean {
  if (!user) return false;
  if (user.roles.includes(ROLES.SUPER_ADMIN) || user.roles.includes(ROLES.ADMIN_OPD)) {
    return true;
  }
  if (
    user.roles.includes(ROLES.LEVEL_1) ||
    user.roles.includes(ROLES.LEVEL_2) ||
    user.roles.includes(ROLES.LEVEL_4)
  ) {
    return false;
  }
  return canAccessIndividu(user);
}

export function canEditOpdRealisasi(user: User | null): boolean {
  if (!user) return false;
  return (
    user.roles.includes(ROLES.SUPER_ADMIN) ||
    user.roles.includes(ROLES.ADMIN_OPD)
  );
}

export function getDefaultPage(user: User | null): string {
  if (!user) return '/';
  if (canAccessPemda(user)) return '/Pemda';
  if (canAccessOpd(user)) return '/Opd';
  if (canAccessIndividu(user)) return '/Individu';
  return '/';
}

export function canAccessRoute(pathname: string, user: User | null): boolean {
  if (!user) return false;
  if (pathname.startsWith('/Pemda')) return canAccessPemda(user);
  if (pathname.startsWith('/Opd/Renja') || pathname.startsWith('/Opd/Renaksi')) {
    return canEditOpdRealisasi(user);
  }
  if (pathname.startsWith('/Opd')) return canAccessOpd(user);
  if (pathname.startsWith('/Individu/Renja')) return canAccessIndividuRenja(user);
  if (pathname.startsWith('/Individu')) return canAccessIndividu(user);
  return true;
}

export function getAccessibleMenus(user: User | null): { name: string; href: string }[] {
  const menus: { name: string; href: string }[] = [];

  if (canAccessPemda(user)) {
    menus.push({ name: 'Pemda', href: '/Pemda' });
  }
  if (canAccessOpd(user)) {
    menus.push({ name: 'OPD', href: '/Opd' });
  }
  if (canAccessIndividu(user)) {
    menus.push({ name: 'Individu', href: '/Individu' });
  }

  return menus;
}

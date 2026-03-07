import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

type RouterLocation = {
  pathname: string;
  search: string;
  hash: string;
};

type NavigateOptions = {
  replace?: boolean;
};

type RouterContextValue = {
  location: RouterLocation;
  navigate: (to: string, options?: NavigateOptions) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);
const RouteContext = createContext<{ params: Record<string, string> }>({
  params: {}
});

function getLocation(): RouterLocation {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', hash: '' };
  }
  const { pathname, search, hash } = window.location;
  return { pathname, search, hash };
}

function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}

type MatchResult = {
  params: Record<string, string>;
};

function matchPath(pattern: string, pathname: string): MatchResult | null {
  if (pattern === '*') {
    return { params: {} };
  }

  const normalizedPattern = normalizePath(pattern);
  const normalizedPathname = normalizePath(pathname);
  const patternSegments = normalizedPattern.split('/').filter(Boolean);
  const pathSegments = normalizedPathname.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegments.length; i += 1) {
    const patternSegment = patternSegments[i];
    const pathSegment = pathSegments[i];

    if (patternSegment.startsWith(':')) {
      const paramName = patternSegment.slice(1);
      params[paramName] = decodeURIComponent(pathSegment);
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return { params };
}

export type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
  replace?: boolean;
};

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState(getLocation());

  useEffect(() => {
    const handlePop = () => {
      setLocation(getLocation());
    };
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
    };
  }, []);

  const navigate = useCallback((to: string, options?: NavigateOptions) => {
    const url = new URL(to, window.location.origin);
    const target = `${url.pathname}${url.search}${url.hash}`;
    if (options?.replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.history.pushState(null, '', target);
    }
    setLocation(getLocation());
  }, []);

  const value = useMemo(
    () => ({
      location,
      navigate
    }),
    [location, navigate]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function Routes({ children }: { children: React.ReactNode }) {
  const context = useContext(RouterContext);
  const location = context?.location ?? getLocation();

  let match: MatchResult | null = null;
  let element: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (match) {
      return;
    }
    if (!React.isValidElement(child)) {
      return;
    }
    const { path, element: routeElement } = child.props as {
      path: string;
      element: React.ReactNode;
    };
    const result = matchPath(path, location.pathname);
    if (result) {
      match = result;
      element = routeElement;
    }
  });

  if (!match || !element) {
    return null;
  }

  return (
    <RouteContext.Provider value={{ params: match.params }}>
      {element}
    </RouteContext.Provider>
  );
}

export type RouteProps = {
  path: string;
  element: React.ReactNode;
};

export function Route(_props: RouteProps) {
  return null;
}

export function Link({ to, replace, onClick, ...rest }: LinkProps) {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('Link must be rendered inside a BrowserRouter');
  }
  const { navigate } = context;

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (onClick) {
      onClick(event);
    }
    if (event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    navigate(to, { replace });
  };

  return <a href={to} onClick={handleClick} {...rest} />;
}

type NavLinkProps = LinkProps & {
  className?: string | ((state: { isActive: boolean }) => string);
  activeClassName?: string;
  children: React.ReactNode;
};

export function NavLink({ to, className, activeClassName, ...rest }: NavLinkProps) {
  const location = useLocation();
  const isActive =
    normalizePath(location.pathname) === normalizePath(to) ||
    (to !== '/' && normalizePath(location.pathname).startsWith(normalizePath(to)));
  const rawClassName =
    typeof className === 'function' ? className({ isActive }) : className;
  const finalClassName = [rawClassName, isActive ? activeClassName : null]
    .filter(Boolean)
    .join(' ');
  return (
    <Link
      to={to}
      {...rest}
      className={finalClassName || undefined}
      aria-current={isActive ? 'page' : undefined}
    />
  );
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useNavigate must be used inside a BrowserRouter');
  }
  return context.navigate;
}

export function useLocation() {
  const context = useContext(RouterContext);
  if (!context) {
    return getLocation();
  }
  return context.location;
}

export function useParams() {
  const context = useContext(RouteContext);
  return context.params;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  return null;
}

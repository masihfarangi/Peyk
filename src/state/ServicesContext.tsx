import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createServices, type Services } from '@/services';

const ServicesContext = createContext<Services | null>(null);

/**
 * Makes the service container available to the tree. Pass `value` to inject
 * fakes in tests; production just uses the default.
 */
export function ServicesProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: Services;
}) {
  const services = useMemo(() => value ?? createServices(), [value]);
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>');
  return services;
}

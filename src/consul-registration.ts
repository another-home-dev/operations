import Consul from 'consul';
import { randomUUID } from 'crypto';

/**
 * Self-registers this instance with Consul so the API Gateway can discover it
 * dynamically instead of relying on a hardcoded host:port. No-ops (with a warning)
 * if CONSUL_HOST isn't set, so local `npm run start` without Docker still works.
 */
export function registerWithConsul(serviceName: string, port: number): void {
    const consulHost = process.env.CONSUL_HOST;
    if (!consulHost) {
        console.warn(`CONSUL_HOST not set — skipping service registry registration for "${serviceName}".`);
        return;
    }

    const consulPort = Number(process.env.CONSUL_PORT ?? 8500);
    const consul = new Consul({ host: consulHost, port: consulPort });

    const address = process.env.SERVICE_ADDRESS ?? serviceName;
    const serviceId = `${serviceName}-${address}-${port}-${randomUUID().slice(0, 8)}`;

    consul.agent.service
        .register({
            id: serviceId,
            name: serviceName,
            address,
            port,
            tags: ['nestjs', 'another-home'],
            check: {
                name: `${serviceName} HTTP health check`,
                http: `http://${address}:${port}/operations/health`,
                interval: '10s',
                timeout: '5s',
                deregistercriticalserviceafter: '1m',
            },
        })
        .then(() => console.log(`Registered "${serviceName}" (${serviceId}) with Consul at ${consulHost}:${consulPort}`))
        .catch((err) => console.error(`Failed to register "${serviceName}" with Consul:`, err instanceof Error ? err.message : err));

    const deregister = () => {
        consul.agent.service
            .deregister(serviceId)
            .catch((err) => console.error(`Failed to deregister "${serviceName}" from Consul:`, err instanceof Error ? err.message : err))
            .finally(() => process.exit(0));
    };

    process.on('SIGINT', deregister);
    process.on('SIGTERM', deregister);
}

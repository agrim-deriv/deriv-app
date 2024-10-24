import { Analytics } from '@deriv-com/analytics';
import Cookies from 'js-cookie';

interface Payload {
    type: string;
    anonymousId: string;
}

type ResponseData = {
    url: string;
    method: string;
    status: number;
    headers: string;
    data: string;
    payload: Payload;
};
type Event = {
    name: string;
    properties: Record<string, string>;
    cache?: boolean;
};
type Item = {
    event: Event;
    cache?: boolean;
    callback?: (e: Event) => Event;
};
const cacheTrackEvents = {
    interval: null as NodeJS.Timeout | null,
    responses: [] as ResponseData[],
    isTrackingResponses: false,
    trackPageUnload: () => {
        window.addEventListener('beforeunload', event => {
            if (!cacheTrackEvents.isPageViewSent()) {
                cacheTrackEvents.push('cached_analytics_page_views', {
                    name: window.location.href,
                    properties: {
                        url: window.location.href,
                    },
                });
            }
        });
    },
    isReady: (): boolean => {
        // eslint-disable-next-line no-console
        console.log('Analytics', Analytics);
        if (Analytics) {
            const instances = Analytics?.getInstances();
            return !!instances?.tracking;
            // eslint-disable-next-line no-console
            console.log('instances tracking', instances);
        }
        return false;
    },

    parseCookies: (cookieName: string): Event[] | null => {
        const cookieValue = Cookies.get(cookieName);
        return cookieValue ? JSON.parse(cookieValue) : null;
    },
    isPageViewSent: (): boolean =>
        !!cacheTrackEvents.responses.find(e => e.payload?.type === 'page' && e.payload?.anonymousId),
    set: (event: Event) => {
        cacheTrackEvents.push('cached_analytics_events', event);
        // eslint-disable-next-line no-console
        console.log('event pushed to cache');
    },
    push: (cookieName: string, data: Event) => {
        let storedCookies: Event[] = [];
        const cacheCookie = cacheTrackEvents.parseCookies(cookieName);
        if (cacheCookie) storedCookies = cacheCookie;
        storedCookies.push(data);
        let domain = '';
        if (window.location.hostname.includes('deriv.com')) {
            domain = '.deriv.com';
        } else if (window.location.hostname.includes('binary.sx')) {
            domain = '.binary.sx';
        } else if (window.location.hostname.includes('localhost')) {
            // eslint-disable-next-line no-console
            console.log('reaches localhost');
            domain = 'localhost:8443';
        }
        document.cookie = `${cookieName}=${JSON.stringify(storedCookies)}; path=/; Domain=${domain}`;
        // eslint-disable-next-line no-console
        console.log('cookie set', document.cookie);
    },
    processEvent: (event: Event): Event => {
        const clientInfo = Cookies.get('client_information');
        if (clientInfo) {
            const { email = null } = JSON.parse(clientInfo);
            if (email) {
                event.properties.email = email;
            }
        }
        if (event?.properties?.email) {
            const email = event.properties.email;
            delete event.properties.email;
        }
        return event;
    },
    track: (originalEvent: Event) => {
        const event: any = cacheTrackEvents.processEvent(originalEvent);
        if (cacheTrackEvents.isReady()) {
            // eslint-disable-next-line no-console
            console.log('tracking with cache');
            Analytics?.trackEvent(event.name, event.properties);
        } else {
            // eslint-disable-next-line no-console
            console.log('create caching mech');
            cacheTrackEvents.set(event);
        }
    },
    pageView: () => {
        if (!cacheTrackEvents.isTrackingResponses) {
            cacheTrackEvents.trackPageUnload();
        }
        let pageViewInterval: NodeJS.Timeout | null = null;
        pageViewInterval = setInterval(() => {
            if (Analytics !== undefined && typeof Analytics?.pageView === 'function' && cacheTrackEvents.isReady()) {
                Analytics?.pageView(window.location.href);
            }
            if (cacheTrackEvents.isPageViewSent()) {
                clearInterval(pageViewInterval!);
            }
        }, 1000);
    },
    loadEvent: (items: Item[]) => {
        items.forEach(({ event }) => {
            // eslint-disable-next-line no-console
            console.log('items', items);
            const { name, properties } = event;
            // eslint-disable-next-line no-console
            console.log('event: ', event);
            cacheTrackEvents.track({
                name,
                properties,
            });
        });
        return cacheTrackEvents;
    },
    pageLoadEvent: (
        items: Array<{ pages?: string[]; excludedPages?: string[]; event: Event; callback?: () => Event }>
    ) => {
        const pathname = window.location.pathname.slice(1);
        if (!Array.isArray(items)) {
            return cacheTrackEvents;
        }
        items.forEach(({ pages = [], excludedPages = [], event, callback = null }) => {
            let dispatch = false;
            if (pages.length) {
                if (pages.includes(pathname)) {
                    dispatch = true;
                }
            } else if (excludedPages.length) {
                if (!excludedPages.includes(pathname)) {
                    dispatch = true;
                }
            } else {
                dispatch = true;
            }
            if (dispatch) {
                const eventData = callback ? callback() : event;
                cacheTrackEvents.loadEvent([
                    {
                        event: eventData,
                    },
                ]);
            }
        });
        return cacheTrackEvents;
    },
};
export default cacheTrackEvents;

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
        if (typeof Analytics === 'undefined' || Analytics === null) {
            return false;
        }
        const instances = Analytics?.getInstances();
        return !!instances?.tracking;
    },
    parseCookies: (cookieName: string): Event[] | null => {
        const cookieValue = Cookies.get(cookieName);
        return cookieValue ? JSON.parse(cookieValue) : null;
    },
    isPageViewSent: (): boolean =>
        !!cacheTrackEvents.responses.find(e => e.payload?.type === 'page' && e.payload?.anonymousId),
    set: (event: Event) => {
        cacheTrackEvents.push('cached_analytics_events', event);
    },
    push: (cookieName: string, data: Event) => {
        let storedCookies: Event[] = [];
        const cacheCookie = cacheTrackEvents.parseCookies(cookieName);
        if (cacheCookie) storedCookies = cacheCookie;
        storedCookies.push(data);
        const domain = window.location.hostname.includes('deriv.com') ? '.deriv.com' : 'binary.sx';
        document.cookie = `${cookieName}=${JSON.stringify(storedCookies)}; path=/; Domain=${domain}`;
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
    track: (originalEvent: Event, cache: boolean) => {
        const event: any = cacheTrackEvents.processEvent(originalEvent);
        if (cacheTrackEvents.isReady() && !cache) {
            Analytics?.trackEvent(event.name, event.properties);
        } else {
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
            const { name, properties } = event;
            cacheTrackEvents.track(
                {
                    name,
                    properties,
                },
                false
            );
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

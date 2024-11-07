import { TLiveChatWidget } from './livechat';

declare global {
    interface Window {
        clipboardData: DataTransfer;
        LiveChatWidget: TLiveChatWidget;
        LC_API: {
            close_chat: () => void;
        };
        TrackJS: { console: { log: (arg0: unknown[]) => void }; track: (arg0: object) => void };
        Blockly;
        Onfido: {
            init: (args: any) => any;
        };
        DD_RUM: object | undefined;
        fcWidget: {
            show: VoidFunction;
            hide: VoidFunction;
            open: VoidFunction;
            close: VoidFunction;
            on: (key: string, callback: VoidFunction) => void;
            setConfig: (config: Record<string, Record<string, any>>) => void;
            isLoaded: () => boolean;
            isInitialized: () => boolean;
            user: {
                setLocale(locale: string): void;
            };
        };
        fcWidgetMessengerConfig: {
            config: Record<string, Record<string, any>>;
        };
        fcSettings: {
            [key: string]: any;
        };
        FreshChat: {
            initialize: (config: FreshChatConfig) => void;
        };
        Analytics: any;
        GrowthbookFeatures: { [key: string]: boolean };
        navigator: Navigator;
    }

    interface FreshChatConfig {
        token: string | null;
        locale?: string;
        hideButton?: boolean;
    }
    interface Navigator {
        connection?: NetworkInformation;
    }
    interface NetworkInformation {
        effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
        rtt?: number;
        downlink?: number;
    }
}

export {};

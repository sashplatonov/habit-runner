
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/(protected)" | "/" | "/auth" | "/auth/callback" | "/(protected)/dashboard" | "/(protected)/habit" | "/(protected)/habit/new" | "/(protected)/habit/[id]" | "/(protected)/habit/[id]/edit" | "/login" | "/(protected)/stats";
		RouteParams(): {
			"/(protected)/habit/[id]": { id: string };
			"/(protected)/habit/[id]/edit": { id: string }
		};
		LayoutParams(): {
			"/(protected)": { id?: string };
			"/": { id?: string };
			"/auth": Record<string, never>;
			"/auth/callback": Record<string, never>;
			"/(protected)/dashboard": Record<string, never>;
			"/(protected)/habit": { id?: string };
			"/(protected)/habit/new": Record<string, never>;
			"/(protected)/habit/[id]": { id: string };
			"/(protected)/habit/[id]/edit": { id: string };
			"/login": Record<string, never>;
			"/(protected)/stats": Record<string, never>
		};
		Pathname(): "/" | "/auth/callback" | "/dashboard" | "/habit/new" | `/habit/${string}` & {} | `/habit/${string}/edit` & {} | "/stats";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/app-icon.svg" | "/apple-touch-icon.png" | "/icon-192.png" | "/icon-512.png" | "/og-image.svg" | "/robots.txt" | "/sitemap.xml" | "/vite.svg" | string & {};
	}
}
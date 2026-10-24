/** iOS Team ID from EAS submit (`store-link-mobile/eas.json`). */
export const IOS_TEAM_ID = 'QMF7S3F5N6';
export const IOS_BUNDLE_ID = 'com.storelink.mobile';
export const ANDROID_PACKAGE = 'ng.storelink.app';

/**
 * SHA-256 of the EAS upload key that signed production AAB 29
 * (`lbyxFSN6afW94MEjlIFClxqXq_GMhXMQJB-mV6dVsso.aab`).
 * Play-installed builds also need the Play App Signing cert — add it here
 * if Android still opens the website after deploy.
 */
export const ANDROID_SHA256_FINGERPRINTS = [
  '6C:81:B5:07:FA:7B:24:34:FD:D7:89:3C:F3:A3:A7:BB:A0:52:A3:FC:79:9C:32:5F:0C:37:DE:6B:02:26:5D:C0',
];

const IOS_APP_ID = `${IOS_TEAM_ID}.${IOS_BUNDLE_ID}`;

/**
 * Paths WhatsApp / SMS / copy shares use. Keep in sync with mobile
 * `shareUtils.ts` + `+native-intent.tsx`. Do not claim marketing/legal pages.
 */
const SHARE_PATHS = [
  '/p/*',
  '/product/*',
  '/r/*',
  '/reel/*',
  '/@*',
  '/service/*',
  '/s/*',
  '/sp/*',
  '/spotlight/*',
  '/story-viewer/*',
  '/curation/*',
  '/u/*',
  '/profile/*',
  '/app/*',
  '/join/g/*',
  '/service-checkout/*',
  '/service-booking/*',
  '/download',
  '/download/*',
] as const;

const SHARE_COMPONENTS = [
  ...SHARE_PATHS.map((path) => ({ '/': path })),
  { '/': '/', '?': { ref: '?*' } },
];

export function appleAppSiteAssociation() {
  return {
    applinks: {
      apps: [] as string[],
      details: [
        {
          appID: IOS_APP_ID,
          appIDs: [IOS_APP_ID],
          paths: [...SHARE_PATHS],
          components: SHARE_COMPONENTS,
        },
      ],
    },
  };
}

export function androidAssetLinks(fingerprints: string[]) {
  const unique = [...new Set(fingerprints.map((f) => f.trim().toUpperCase()).filter(Boolean))];
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: unique,
      },
    },
  ];
}

export const WELL_KNOWN_JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=3600',
} as const;

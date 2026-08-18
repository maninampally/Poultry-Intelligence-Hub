export const mobileAppStatus = 'Murgi Mitra mobile app scaffold';

export type AppPlatform = 'android' | 'ios';

export interface MobileBootstrap {
  platform: AppPlatform;
  status: 'scaffolded';
}

export const bootstrapMobileApp = (platform: AppPlatform): MobileBootstrap => ({
  platform,
  status: 'scaffolded',
});

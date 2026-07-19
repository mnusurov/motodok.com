export interface SocialPlatform {
  name: string
  username: string
  url: string
  icon: string
}

export const socialPlatforms: SocialPlatform[] = [
  {
    name: 'Telegram',
    username: '@motodok',
    url: 'https://t.me/motodok',
    icon: 'telegram',
  },
  {
    name: 'Instagram',
    username: '@motodok',
    url: 'https://instagram.com/motodok',
    icon: 'instagram',
  },
  {
    name: 'Facebook',
    username: 'Motodok',
    url: 'https://facebook.com/motodok',
    icon: 'facebook',
  },
  {
    name: 'Twitter / X',
    username: '@motodok',
    url: 'https://x.com/motodok',
    icon: 'twitter',
  },
  {
    name: 'YouTube',
    username: 'Motodok',
    url: 'https://youtube.com/@motodok',
    icon: 'youtube',
  },
]

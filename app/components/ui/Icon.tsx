import { 
  Car, Briefcase, HeartPulse, Home, Utensils, 
  Tag, ShoppingBag, Coffee, Smartphone, Zap, 
  Plane, Film, Monitor, Shield, PiggyBank,
  TrendingDown, TrendingUp
} from 'lucide-react'

export default function Icon({ name, className }: { name: string | null, className?: string }) {
  if (!name) return <Tag className={className} />
  
  // If it's a raw emoji (contains non-ASCII characters or matches emoji regex roughly)
  const isEmoji = /\p{Emoji}/u.test(name)
  if (isEmoji && name.length <= 4) { // Only render if it's literally just an emoji
    return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 'inherit' }}>{name}</span>
  }
  
  switch (name.toLowerCase()) {
    case 'car': return <Car className={className} />
    case 'briefcase': return <Briefcase className={className} />
    case 'heart-pulse': return <HeartPulse className={className} />
    case 'home': return <Home className={className} />
    case 'utensils': return <Utensils className={className} />
    case 'shopping-bag': return <ShoppingBag className={className} />
    case 'coffee': return <Coffee className={className} />
    case 'smartphone': return <Smartphone className={className} />
    case 'zap': return <Zap className={className} />
    case 'plane': return <Plane className={className} />
    case 'film': return <Film className={className} />
    case 'monitor': return <Monitor className={className} />
    case 'shield': return <Shield className={className} />
    case 'piggy-bank': return <PiggyBank className={className} />
    case 'trending-down': return <TrendingDown className={className} />
    case 'trending-up': return <TrendingUp className={className} />
    default: return <Tag className={className} />
  }
}

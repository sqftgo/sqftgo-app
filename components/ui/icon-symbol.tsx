import React from 'react';
import { 
  Home, 
  Send, 
  Code, 
  ChevronRight, 
  ChevronLeft, 
  Heart, 
  User, 
  Users, 
  Plus, 
  Search, 
  Bell, 
  Sliders, 
  BedDouble, 
  Star, 
  MapPin 
} from 'lucide-react-native';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

const MAPPING = {
  'house.fill': Home,
  'paperplane.fill': Send,
  'chevron.left.forwardslash.chevron.right': Code,
  'chevron.right': ChevronRight,
  'chevron.left': ChevronLeft,
  'heart.fill': Heart,
  'person.fill': User,
  'person.2.fill': Users,
  'plus.circle.fill': Plus,
  'magnifyingglass': Search,
  'bell.fill': Bell,
  'slider.horizontal.3': Sliders,
  'bed.double.fill': BedDouble,
  'star.fill': Star,
  'mappin.circle.fill': MapPin,
};

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: string;
}) {
  const IconComponent = MAPPING[name];
  if (!IconComponent) return null;
  
  // Lucide handles OpaqueColorValue types as color strings in react-native wrapper
  return <IconComponent size={size} color={color as string} style={style as any} />;
}

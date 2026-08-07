import React from 'react';
import { 
  Home, 
  Send, 
  Code, 
  NavArrowRight, 
  NavArrowLeft, 
  Heart, 
  User, 
  Group, 
  Plus, 
  Search, 
  Bell, 
  ControlSlider, 
  BedReady, 
  Star, 
  MapPin 
} from 'iconoir-react-native';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

const MAPPING = {
  'house.fill': Home,
  'paperplane.fill': Send,
  'chevron.left.forwardslash.chevron.right': Code,
  'chevron.right': NavArrowRight,
  'chevron.left': NavArrowLeft,
  'heart.fill': Heart,
  'person.fill': User,
  'person.2.fill': Group,
  'plus.circle.fill': Plus,
  'magnifyingglass': Search,
  'bell.fill': Bell,
  'slider.horizontal.3': ControlSlider,
  'bed.double.fill': BedReady,
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
  
  return <IconComponent width={size} height={size} color={color as string} style={style as any} />;
}

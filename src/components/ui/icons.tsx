import React from 'react';
import * as Iconoir from 'iconoir-react-native';
import type { SvgProps } from 'react-native-svg';

export interface IconProps extends Omit<SvgProps, 'color'> {
  size?: number;
  color?: string;
  strokeWidth?: number | string;
}

export type IconComponent = React.ComponentType<IconProps>;
export type LucideIcon = IconComponent;

function wrapIcon(Component: React.ComponentType<any>): IconComponent {
  const IconWrapper = React.forwardRef<any, IconProps>(({ size, width, height, color, style, strokeWidth, ...props }, ref) => {
    const w = width ?? size ?? 24;
    const h = height ?? size ?? 24;
    return (
      <Component
        ref={ref}
        width={w}
        height={h}
        color={color}
        style={style}
        strokeWidth={strokeWidth}
        {...props}
      />
    );
  });
  IconWrapper.displayName = Component.displayName || 'IconoirWrapper';
  return IconWrapper;
}

// Canonical Iconoir Icons
export const ArrowRight = wrapIcon(Iconoir.ArrowRight);
export const Bathroom = wrapIcon(Iconoir.Bathroom);
export const Bed = wrapIcon(Iconoir.Bed);
export const BedReady = wrapIcon(Iconoir.BedReady);
export const Bell = wrapIcon(Iconoir.Bell);
export const BellOff = wrapIcon(Iconoir.BellOff);
export const Bookmark = wrapIcon(Iconoir.Bookmark);
export const Building = wrapIcon(Iconoir.Building);
export const Calendar = wrapIcon(Iconoir.Calendar);
export const ChatBubble = wrapIcon(Iconoir.ChatBubble);
export const Check = wrapIcon(Iconoir.Check);
export const CheckCircle = wrapIcon(Iconoir.CheckCircle);
export const Clock = wrapIcon(Iconoir.Clock);
export const Code = wrapIcon(Iconoir.Code);
export const Compass = wrapIcon(Iconoir.Compass);
export const ControlSlider = wrapIcon(Iconoir.ControlSlider);
export const CreditCard = wrapIcon(Iconoir.CreditCard);
export const Dashboard = wrapIcon(Iconoir.Dashboard);
export const DocStar = wrapIcon(Iconoir.DocStar);
export const Droplet = wrapIcon(Iconoir.Droplet);
export const EditPencil = wrapIcon(Iconoir.EditPencil);
export const Eye = wrapIcon(Iconoir.Eye);
export const EyeClosed = wrapIcon(Iconoir.EyeClosed);
export const Flash = wrapIcon(Iconoir.Flash);
export const GraphUp = wrapIcon(Iconoir.GraphUp);
export const Group = wrapIcon(Iconoir.Group);
export const Heart = wrapIcon(Iconoir.Heart);
export const HelpCircle = wrapIcon(Iconoir.HelpCircle);
export const Home = wrapIcon(Iconoir.Home);
export const InfoCircle = wrapIcon(Iconoir.InfoCircle);
export const Key = wrapIcon(Iconoir.Key);
export const Lock = wrapIcon(Iconoir.Lock);
export const LogOut = wrapIcon(Iconoir.LogOut);
export const Mail = wrapIcon(Iconoir.Mail);
export const MailIn = wrapIcon(Iconoir.MailIn);
export const MapPin = wrapIcon(Iconoir.MapPin);
export const Maximize = wrapIcon(Iconoir.Maximize);
export const NavArrowDown = wrapIcon(Iconoir.NavArrowDown);
export const NavArrowLeft = wrapIcon(Iconoir.NavArrowLeft);
export const NavArrowRight = wrapIcon(Iconoir.NavArrowRight);
export const NavArrowUp = wrapIcon(Iconoir.NavArrowUp);
export const Page = wrapIcon(Iconoir.Page);
export const PageSearch = wrapIcon(Iconoir.PageSearch);
export const Phone = wrapIcon(Iconoir.Phone);
export const PhoneIncome = wrapIcon(Iconoir.PhoneIncome);
export const Plus = wrapIcon(Iconoir.Plus);
export const PlusCircle = wrapIcon(Iconoir.PlusCircle);
export const Refresh = wrapIcon(Iconoir.Refresh);
export const Search = wrapIcon(Iconoir.Search);
export const Send = wrapIcon(Iconoir.Send);
export const Settings = wrapIcon(Iconoir.Settings);
export const ShareIos = wrapIcon(Iconoir.ShareIos);
export const Shield = wrapIcon(Iconoir.Shield);
export const ShieldCheck = wrapIcon(Iconoir.ShieldCheck);
export const Shop = wrapIcon(Iconoir.Shop);
export const ShoppingBag = wrapIcon(Iconoir.ShoppingBag);
export const Sparks = wrapIcon(Iconoir.Sparks);
export const Star = wrapIcon(Iconoir.Star);
export const StatsReport = wrapIcon(Iconoir.StatsReport);
export const SubmitDocument = wrapIcon(Iconoir.SubmitDocument);
export const Suitcase = wrapIcon(Iconoir.Suitcase);
export const TaskList = wrapIcon(Iconoir.TaskList);
export const Train = wrapIcon(Iconoir.Train);
export const Trash = wrapIcon(Iconoir.Trash);
export const User = wrapIcon(Iconoir.User);
export const ViewGrid = wrapIcon(Iconoir.ViewGrid);
export const WifiOff = wrapIcon(Iconoir.WifiOff);
export const Xmark = wrapIcon(Iconoir.Xmark);

// Lucide Aliases to Iconoir
export const ArrowRightIcon = ArrowRight;
export const BarChart3 = StatsReport;
export const Bath = Bathroom;
export const BedDouble = BedReady;
export const Briefcase = Suitcase;
export const BriefcaseIcon = Suitcase;
export const Building2 = Building;
export const Building2Icon = Building;
export const CheckIcon = Check;
export const CheckCircle2 = CheckCircle;
export const CheckCircle2Icon = CheckCircle;
export const ChevronDown = NavArrowDown;
export const ChevronLeft = NavArrowLeft;
export const ChevronLeftIcon = NavArrowLeft;
export const ChevronRight = NavArrowRight;
export const ChevronRightIcon = NavArrowRight;
export const ChevronUp = NavArrowUp;
export const ClipboardList = TaskList;
export const EyeOff = EyeClosed;
export const FileCheck = SubmitDocument;
export const FileText = Page;
export const Grid = ViewGrid;
export const HomeIcon = Home;
export const Inbox = MailIn;
export const Info = InfoCircle;
export const KeyRound = Key;
export const LayoutDashboard = Dashboard;
export const Maximize2 = Maximize;
export const MessageSquare = ChatBubble;
export const MapPinIcon = MapPin;
export const Pencil = EditPencil;
export const PhoneCall = PhoneIncome;
export const PhoneCallIcon = PhoneIncome;
export const RefreshCw = Refresh;
export const RefreshCwIcon = Refresh;
export const SearchX = PageSearch;
export const Share2 = ShareIos;
export const ShieldCheckIcon = ShieldCheck;
export const Sliders = ControlSlider;
export const SlidersHorizontal = ControlSlider;
export const Sparkles = Sparks;
export const SparklesIcon = Sparks;
export const Store = Shop;
export const Trash2 = Trash;
export const TrendingUp = GraphUp;
export const TrendingUpIcon = GraphUp;
export const UserIcon = User;
export const Users = Group;
export const WifiOffIcon = WifiOff;
export const X = Xmark;
export const Zap = Flash;

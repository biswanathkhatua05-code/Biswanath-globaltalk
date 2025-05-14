import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from 'lucide-react'; // Using User icon as fallback

interface UserAvatarProps {
  user?: User;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.id ? user.id.substring(0, 2) : '');
  
  return (
    <Avatar className={className}>
      {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || 'User Avatar'} data-ai-hint="profile picture" />}
      <AvatarFallback className="bg-muted text-muted-foreground">
        {initial || <UserIcon size={20} />}
      </AvatarFallback>
    </Avatar>
  );
}

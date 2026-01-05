export class PublicUserDto {
  id: string;
  name: string;
  role: string;
  skills: string[];
  avatarUrl: string | null;
  status: string;
  nickname: string | null;
}

export class PrivateUserDto extends PublicUserDto {
  email: string | null;
  hourlyRate: number | null;
  phoneNumber: string | null;
  maxHours: number | null;
}


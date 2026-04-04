import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type TradingPreset = 'institutional' | 'degen';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  dynamicId: string;

  @Column()
  walletAddress: string;

  @Column({ nullable: true, type: 'varchar' })
  preset: TradingPreset | null;

  @Column({ nullable: true })
  dynamicWalletId: string | null;

  @Column({ nullable: true, type: 'text' })
  delegatedShare: string | null;

  @Column({ nullable: true, type: 'text' })
  walletApiKey: string | null;

  @CreateDateColumn()
  createdAt: Date;

  isDelegated(): boolean {
    return !!this.delegatedShare;
  }
}

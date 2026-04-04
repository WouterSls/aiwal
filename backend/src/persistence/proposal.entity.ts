import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

export type ProposalType = 'market' | 'limit' | 'stop_loss' | 'take_profit';
export type ProposalAction = 'buy' | 'sell';
export type ProposalStatus = 'confirmed' | 'completed' | 'failed';

@Entity('proposals')
export class ProposalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  type: ProposalType;

  @Column()
  action: ProposalAction;

  @Column()
  tokenIn: string;

  @Column()
  tokenOut: string;

  @Column()
  amountIn: string;

  @Column({ nullable: true })
  expectedOut: string | null;

  @Column({ nullable: true })
  slippage: string | null;

  @Column({ nullable: true, type: 'text' })
  condition: string | null;

  @Column({ default: 'confirmed' })
  status: ProposalStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

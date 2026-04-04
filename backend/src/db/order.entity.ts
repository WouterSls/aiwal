import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProposalEntity } from './proposal.entity';

export type OrderStatus = 'pending' | 'executing' | 'completed' | 'failed';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  proposalId: string;

  @ManyToOne(() => ProposalEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposalId' })
  proposal: ProposalEntity;

  @Column({ nullable: true })
  txHash: string | null;

  @Column({ default: 'pending' })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

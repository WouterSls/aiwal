import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProposalEntity } from './proposal.entity.js';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  proposalId: string;

  @ManyToOne(() => ProposalEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposalId' })
  proposal: ProposalEntity;

  @Column()
  type: string;

  @Column()
  amountIn: string;

  @Column({ nullable: true, type: 'varchar' })
  expectedOut: string | null;

  @Column({ nullable: true, type: 'varchar' })
  to: string | null;

  @Column({ nullable: true, type: 'varchar' })
  slippageTolerance: string | null;

  @Column({ nullable: true, type: 'float' })
  tradingPriceUsd: number | null;

  @Column({ nullable: true, type: 'varchar' })
  confirmationHash: string | null;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

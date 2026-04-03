import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Click } from '../../clicks/entities/click.entity';

@Entity('urls')
export class Url {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  shortCode: string;

  @Column('text')
  originalUrl: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Click, click => click.url)
  clicks: Click[];
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Url } from '../../urls/entities/url.entity';

@Entity('clicks')
@Index(['urlId'])
@Index(['clickedAt'])
export class Click {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  urlId: string;

  @ManyToOne(() => Url, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'urlId' })
  url: Url;

  @Column()
  ip: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  os: string;

  @Column({ nullable: true })
  referrer: string;

  @CreateDateColumn()
  clickedAt: Date;
}
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  Default,
  IsUUID,
  PrimaryKey,
  DeletedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { User } from './User';
import { UrlAnalytics } from './UrlAnalytics';

@Table({ tableName: 'urls', timestamps: true })
export class Url extends Model<InferAttributes<Url>, InferCreationAttributes<Url>> {
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  id!: CreationOptional<string>;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  shortCode!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  originalUrl!: string;

  @Default(0)
  @Column(DataType.INTEGER)
  clicks!: number;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt!: CreationOptional<Date>;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt!: CreationOptional<Date>;

  @DeletedAt
  @Column({ type: DataType.DATE })
  deletedAt!: CreationOptional<Date>;

  @BelongsTo(() => User, { foreignKey: { allowNull: false, field: 'userId' } })
  user?: User;

  @HasMany(() => UrlAnalytics)
  analytics!: CreationOptional<UrlAnalytics[]>;
}

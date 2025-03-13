import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  Default,
  IsUUID,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { Url } from './Url';

@Table({ tableName: 'url_analytics', timestamps: true })
export class UrlAnalytics extends Model<
  InferAttributes<UrlAnalytics>,
  InferCreationAttributes<UrlAnalytics>
> {
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  id!: CreationOptional<string>;

  @ForeignKey(() => Url)
  @Column(DataType.UUID)
  urlId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  referrer!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  userAgent!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  ipAddress!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  country!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  city!: string | null;

  @CreatedAt
  @Column({ type: DataType.DATE })
  clickedAt!: CreationOptional<Date>;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt!: CreationOptional<Date>;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt!: CreationOptional<Date>;

  @DeletedAt
  @Column({ type: DataType.DATE })
  deletedAt!: CreationOptional<Date>;

  @BelongsTo(() => Url, { foreignKey: { allowNull: false } })
  url?: Url;
}

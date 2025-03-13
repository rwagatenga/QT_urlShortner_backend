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
  AllowNull,
  DeletedAt,
  HasMany,
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { Url } from './Url';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  id!: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.STRING)
  firstName!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  lastName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  username!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  password!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isEmailVerified!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    validate: {
      is: /^[a-f0-9]{64}$/i,
    },
  })
  emailVerificationToken!: CreationOptional<string | null>;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  lastLogin!: Date;

  @AllowNull(true)
  @Column(DataType.STRING)
  avatar!: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt!: CreationOptional<Date>;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt!: CreationOptional<Date>;

  @DeletedAt
  @Column({ type: DataType.DATE })
  deletedAt!: CreationOptional<Date>;

  @HasMany(() => Url, { foreignKey: 'userId' })
  urls!: CreationOptional<Url[]>;
}

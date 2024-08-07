import { DataSourceOptions } from 'typeorm'

/** utils */
import { getHomeDir } from '@main/utils/index'

export const ormconfig: DataSourceOptions = {
  type: 'sqlite',
  database: `${getHomeDir()}/src/main//database/resources/database.sqlite`,
  entities: [`${getHomeDir()}/model/*.js`],
  migrations: [`${getHomeDir()}/migrations/*.js`],
  migrationsRun: true, // マイグレーション同時実行
  synchronize: false
}

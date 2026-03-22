import Typography from '@/components/ui/Typography/Typography'
import styles from './PageHeader.module.css'

export interface PageHeaderProps {
  title: string
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className={styles.root}>
      <Typography variant="displayLarge" as="h1">{title}</Typography>
      <hr className={styles.rule} />
    </div>
  )
}

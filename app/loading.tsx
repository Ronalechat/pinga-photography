import Typography from '@/components/ui/Typography/Typography'
import styles from './loading.module.css'

export default function Loading() {
  return (
    <div className={styles.root} aria-label="Loading" role="status">
      <Typography variant="displayThin" as="span" className={styles.wordmark}>
        P!NGA
      </Typography>
      <div className={styles.iris} aria-hidden="true" />
    </div>
  )
}

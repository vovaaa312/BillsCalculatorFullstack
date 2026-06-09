import Modal from './Modal'
import { useTranslation } from 'react-i18next'

interface Props {
  onConfirm: () => void
  onClose: () => void
  clearing?: boolean
}

export default function ClearConfirmModal({ onConfirm, onClose, clearing }: Props) {
  const { t } = useTranslation()
  return (
    <Modal title={t('io.clearTitle')} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded p-3 text-sm text-amber-800 dark:text-amber-300">
          ⚠️ {t('io.clearBackupWarning')}
        </div>
        <p className="text-sm dark:text-gray-300">{t('io.clearConfirm')}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={clearing}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {clearing ? t('io.clearing') : t('io.clearBtn')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

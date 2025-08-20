'use client';

interface ActivateStickerButtonProps {
  stickerId: string;
}

export default function ActivateStickerButton({
  stickerId,
}: ActivateStickerButtonProps) {
  const handleActivate = async () => {
    // eslint-disable-next-line no-alert
    if (confirm('¿Estás seguro de que quieres activar este sticker?')) {
      try {
        const response = await fetch(`/api/stickers/${stickerId}/activate`, {
          method: 'POST',
        });
        if (response.ok) {
          window.location.reload();
        } else {
          // eslint-disable-next-line no-alert
          alert('Error al activar el sticker');
        }
      } catch (err) {
        console.error('Error activating sticker:', err);
        // eslint-disable-next-line no-alert
        alert('Error al activar el sticker');
      }
    }
  };

  return (
    <button className="btn btn-secondary" onClick={handleActivate}>
      Activar sticker
    </button>
  );
}

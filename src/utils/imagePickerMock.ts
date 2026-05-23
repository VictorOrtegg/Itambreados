// Web mock and implementation for expo-image-picker using browser API

export const MediaTypeOptions = {
  All: 'All',
  Images: 'Images',
  Videos: 'Videos',
};

export async function requestMediaLibraryPermissionsAsync() {
  return { granted: true, status: 'granted', canAskAgain: true };
}

export async function launchImageLibraryAsync(_options?: any) {
  return new Promise((resolve) => {
    // Create an input element dynamically
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        resolve({ canceled: true, assets: null });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // base64String is something like "data:image/png;base64,iVBORw0KGgo..."
        // expo-image-picker returns assets: [{ uri, base64, mimeType }]
        const parts = base64String.split(';base64,');
        const mimeType = parts[0].split(':')[1] || 'image/jpeg';
        const base64 = parts[1];

        resolve({
          canceled: false,
          assets: [
            {
              uri: base64String,
              base64: base64,
              mimeType: mimeType,
              width: 200,
              height: 200,
            }
          ]
        });
      };
      reader.onerror = () => {
        resolve({ canceled: true, assets: null });
      };
      reader.readAsDataURL(file);
    };

    input.oncancel = () => {
      resolve({ canceled: true, assets: null });
    };

    // Trigger click
    input.click();
  });
}

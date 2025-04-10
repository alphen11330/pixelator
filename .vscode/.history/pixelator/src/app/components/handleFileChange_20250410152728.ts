  type Props = {
    event: React.ChangeEvent<HTMLInputElement>
    setImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
    setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  };
  
  const handleFileChange = ({event, setImageSrc, setSmoothImageSrc}:Props) => {
    const MAX_SIZE = 512;
    
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const img = new Image();
        img.src = e.target.result as string;
        img.onload = () => {
          const { width, height } = img;
          let newWidth = width;
          let newHeight = height;

          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              newWidth = MAX_SIZE;
              newHeight = (height / width) * MAX_SIZE;
            } else {
              newHeight = MAX_SIZE;
              newWidth = (width / height) * MAX_SIZE;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = newWidth;
          canvas.height = newHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            const resizedDataUrl = canvas.toDataURL("image/png");
            setImageSrc(resizedDataUrl);
            setSmoothImageSrc(resizedDataUrl);
          }
        };
      }
    };
    reader.readAsDataURL(file);
  };

  export default handleFileChange
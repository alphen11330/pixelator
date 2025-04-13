declare module 'ditherjs' {
    interface DitherOptions {
        palette: number[][];
    }

    class Dither {
        constructor(options: DitherOptions);

        dither(imageData: any): any;
    }

    export default Dither;
}

import {Component, HostListener, Input, OnInit} from '@angular/core';
import * as SparkMD5 from 'spark-md5/spark-md5.js';

@Component({
    selector: 'app-drop-box',
    templateUrl: './drop-box.component.html',
    styleUrls: ['./drop-box.component.css']
})
export class DropBoxComponent{
    private chunkSize = 2097152;  // read in chunks of 2MB
    private chunks = 0;

    private currentChunk: number;
    private spark: any;

    public progress: number = 0;
    public hover: boolean = false;
    public image = {
        name: '',
        size: 0,
        hash: '',
        thumbnail: null
    };

    @HostListener('drop', [ '$event' ])
    public onDrop(event: any): void {
        this._preventAndStop(event);
        const transfer = event.dataTransfer;
        this.hover = false;

        Array.from(transfer.files).map((file: File) => {
            this.calculateHash(file);
        });
    }

    private calculateHash(file: File) {
        this.chunks = Math.ceil(file.size / this.chunkSize);
        this.image.name = file.name;
        this.image.size = Math.round(file.size / (Math.pow(2, 20)));
        this.currentChunk = 0;
        this.spark = new SparkMD5.ArrayBuffer();

        this.loadNextPart(file);
    }

    private loadNextPart(file: File) {
        const fileReader = new FileReader();

        fileReader.onload = (e: ProgressEvent) => {
            this.spark.append(e.target.result);
            this.currentChunk++;
            this.progress = Math.round((this.currentChunk / this.chunks) * 100);

            if (this.currentChunk < this.chunks) {
                this.loadNextPart(file);
            } else {
                this.image.hash = this.spark.end();
            }
        };

        const start = this.currentChunk * this.chunkSize;
        const end = ((start + this.chunkSize) >= file.size) ? file.size : start + this.chunkSize;
        fileReader.readAsArrayBuffer(File.prototype.slice.call(file, start, end));
    }

    @HostListener('dragover', [ '$event' ])
    public onDragOver(event: any): void {
        this.hover = true;
        this._preventAndStop(event);
    }

    @HostListener('dragleave', [ '$event' ])
    public onDragLeave(event: any): any {
        this.hover = false;
        this._preventAndStop(event);
    }


    private _preventAndStop(event: any): any {
        event.preventDefault();
        event.stopPropagation();
    }
}

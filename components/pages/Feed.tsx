import Image from "next/image";
import Card from "../ui/Card";

import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonMenuButton,
    IonModal,
} from "@ionic/react";
import Notifications from "./Notifications";
import {
    Barcode,
    BarcodeFormat,
    BarcodeScanner,
} from "@capacitor-mlkit/barcode-scanning";
import { useState } from "react";
import { notificationsOutline } from "ionicons/icons";
import { selectHomeItems } from "../../store/selectors";
import Store from "../../store";
import { verifyJWT } from "../../misc/crypt";
import { JWTPayload } from "jose";

type FeedCardProps = {
    title: string;
    type: string;
    text: string;
    author: string;
    authorAvatar: string;
    image: string;
};

const FeedCard = ({ title, type, text, author, authorAvatar, image }: FeedCardProps) => (
    <Card className="my-4 mx-auto">
        <div className="h-32 w-full relative">
            <Image
                className="rounded-t-xl object-cover min-w-full min-h-full max-w-full max-h-full"
                src={image}
                alt=""
                fill
            />
        </div>
        <div className="px-4 py-4 bg-white rounded-b-xl dark:bg-gray-900">
            <h4 className="font-bold py-0 text-s text-gray-400 dark:text-gray-500 uppercase">
                {type}
            </h4>
            <h2 className="font-bold text-2xl text-gray-800 dark:text-gray-100">
                {title}
            </h2>
            <p className="sm:text-sm text-s text-gray-500 mr-1 my-3 dark:text-gray-400">
                {text}
            </p>
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 relative">
                    <Image
                        src={authorAvatar}
                        className="rounded-full object-cover min-w-full min-h-full max-w-full max-h-full"
                        alt=""
                        fill
                    />
                </div>
                <h3 className="text-gray-500 dark:text-gray-200 m-l-8 text-sm font-medium">
                    {author}
                </h3>
            </div>
        </div>
    </Card>
);

const Feed = () => {
    const homeItems = Store.useState(selectHomeItems);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedCode, setScannedCode] = useState<JWTPayload>();

    async function parseBarcode(barcode: Barcode) {
        if (barcode.format === BarcodeFormat.QrCode) {
            const { payload } = await verifyJWT(barcode.displayValue);
            setScannedCode(payload);
        }
    }

    async function requestPermissions() {
        await BarcodeScanner.requestPermissions();
    }

    async function scanWithGoogleServices() {
        const { barcodes } = await BarcodeScanner.scan({
            formats: [BarcodeFormat.QrCode],
        });
        if (barcodes.length > 0) {
            parseBarcode(barcodes[0]);
        }
        setIsScanning(false);
    }

    async function scanSingleBarcode() {
        return new Promise(async (resolve) => {
            document.querySelector("body")?.classList.add("barcode-scanner-active");

            const listener = await BarcodeScanner.addListener(
                "barcodeScanned",
                async (result) => {
                    await listener.remove();
                    document
                        .querySelector("body")
                        ?.classList.remove("barcode-scanner-active");
                    await BarcodeScanner.stopScan();
                    parseBarcode(result.barcode);
                    stopScan();
                    resolve(result.barcode);
                },
            );

            setIsScanning(true);
            await BarcodeScanner.startScan();
        });
    }

    async function stopScan() {
        setIsScanning(false);
        await BarcodeScanner.stopScan();
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Feed</IonTitle>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setShowNotifications(true)}>
                            <IonIcon icon={notificationsOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">Feed</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <Notifications
                    open={showNotifications}
                    onDidDismiss={() => setShowNotifications(false)}
                />
                {/* {homeItems.map((i, index) => (
          <FeedCard {...i} key={index} />
        ))} */}

                <IonButton onClick={requestPermissions} disabled={isScanning}>
                    Request Permissions
                </IonButton>

                <IonButton onClick={scanSingleBarcode} disabled={isScanning}>
                    Scan Single Barcode
                </IonButton>

                <IonButton onClick={scanWithGoogleServices} disabled={isScanning}>
                    Scan With Google Services
                </IonButton>

                {/* <IonButton onClick={() => parseBarcode(null)} disabled={isScanning}>
                    Parse Code
                </IonButton> */}

                {scannedCode && (
                    <div>
                        <h3>{JSON.stringify(scannedCode)}</h3>
                    </div>
                )}

                <IonModal
                    className="barcode-scanning-modal"
                    showBackdrop={false}
                    isOpen={isScanning}
                    onDidDismiss={stopScan}
                >
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Scanning</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                </IonModal>
            </IonContent>
        </IonPage>
    );
};

export default Feed;

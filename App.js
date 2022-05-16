import {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import MapView, {Marker} from 'react-native-maps';
import {Platform, Pressable, Text} from "react-native";
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NativeBaseProvider, Box, Center, Actionsheet, View, useDisclose, Button} from 'native-base';
import * as Location from 'expo-location';
import * as Device from "expo-device";
import {MaterialIcons} from "@expo/vector-icons";
import {FontAwesome5} from "@expo/vector-icons";
import Ionicons from 'react-native-vector-icons/Ionicons';
import mapStyle from "./styles/mapStyle.json"
import metroJson from "./json/metro.json";
import axios from "axios";
import {Dimensions} from "react-native";
import {PieChart} from "react-native-chart-kit";

const WIDTH = Dimensions.get("screen").width

const getUbike = async () => {
	return await axios.get("https://data.ntpc.gov.tw/api/datasets/71CD1490-A2DF-4198-BEF1-318479775E8A/json?page=0&size=200")
}

const MarkerMemo = (site) => useMemo(() => {
	return (
		<Marker
			coordinate={{latitude: site.latitude, longitude: site.longitude}}
			key={`${site.id}${site.line}`}
			title={site.name}
			description={site.address}
		>
			<Center bg={site.line === "南港、板橋、土城線" ? "#7777ff" : "white"} borderRadius={60} p={1.5} borderWidth={3}>
				<MaterialIcons name={"train"} size={24} color="black"/>
			</Center>
		</Marker>
	)
}, site)

export default function App() {

	const mapRef = useRef()

	const [msg, setMsg] = useState("Waiting...");
	const [onCurrentLocation, setOnCurrentLocation] = useState(false);
	const [metro, setMetro] = useState(metroJson);
	const [stationBike, setStationBike] = useState({
			total: 24,
		   bikes: 17
		}
	);
	const [zoomRatio, setZoomRatio] = useState(1);


	const [station, setStation] = useState({
		type: "",
		title: "",
		description: "",
		lat: "",
		lon: "",
	})


	const [region, setRegion] = useState({
		longitude: 121.544637,
		latitude: 25.024624,
		longitudeDelta: 0.02,
		latitudeDelta: 0.04,
	})

	const [marker, setMarker] = useState({
		coord: {
			longitude: 121.544637,
			latitude: 25.024624,
		},
		// name: "國立臺北教育大學",
		// address: "台北市和平東路二段134號",
	});

	const [ubikeData, setUbikeData] = useState()

	const onRegionChangeComplete = (rgn) => {
		if (rgn.longitudeDelta > 0.02)
			setZoomRatio(0.02 / rgn.longitudeDelta);
		else
			setZoomRatio(1);
	}

	const setRegionAndMarker = (location) => {
		setRegion({
			...region,
			longitude: location.coords.longitude,
			latitude: location.coords.latitude,
		});
		setMarker({
			...marker,
			coord: {
				longitude: location.coords.longitude,
				latitude: location.coords.latitude,
			},
		});
	};

	const getUbikeData = async () => {
		const bikeData = await getUbike();
		setUbikeData(bikeData);
	};


	const getLocation = async () => {
		let {status} = await Location.requestForegroundPermissionsAsync();
		if (status !== 'granted') {
			setMsg('Permission to access location was denied');
			return;
		}
		let location = await Location.getCurrentPositionAsync({});
		setRegionAndMarker(location);
		setOnCurrentLocation(true);
	}

	useEffect(() => {
		if (Platform.OS === "android" && !Device.isDevice) {
			setMsg(
				"Oops, this will not work on Sketch in an Android emulator. Try it on your device!"
			);
			return
		}
		getLocation();
		getUbikeData()
	}, []);

	useEffect(() => {
		console.log("render")
		console.log(station)
		console.log(stationBike)
	})

	const {
		isOpen,
		onOpen,
		onClose
	} = useDisclose();

	return (
		<SafeAreaProvider>
			<NativeBaseProvider>
				<Actionsheet
					isOpen={isOpen} onClose={onClose}
				>
					<Actionsheet.Content
						background={"#222"}
					>
						<View style={{
							padding: 16,
							height: 256,
							width: "100%",
							flexDirection: "column",

							backgroundColor: "#222"
						}}>
							<Text style={{
								marginLeft: 8,
								fontSize: 26,
								color: "#eee",
								fontWeight: "bold"
							}}>
								{station.type === "mrt" ?
									"捷運" + station.title + "站" : "UBike" + station.title + "站"
								}
							</Text>

							<Text style={{
								marginLeft: 8,
								color: "#eee",

								fontSize: 16,
								fontWeight: "normal",
								paddingTop: 8,
								letterSpacing: .5,
							}}>
								{station.description}
							</Text>

							<View style={{
								height: "auto",
								width: "100%",
								borderRadius: 24,
								marginTop: 24,
								backgroundColor: "#222",
								borderColor: "#fff",
								borderWidth: 2,
								padding: 16,
							}}>
								<Text style={{

									color: "#eee",
									paddingLeft: 4,


									fontSize: 16,
									fontWeight: "normal",

									letterSpacing: .5,
								}}>
									{"Longitude : " + station.lon}
								</Text>

								<Text style={{

									color: "#eee",
									paddingLeft: 4,

									fontSize: 16,
									fontWeight: "normal",

									letterSpacing: .5,
								}}>
									{"Latitude : " + station.lat}
								</Text>
								{station.type !== "mrt"?
									<View style={{
									borderRadius: 64,

									marginTop: 16,
									overflow: "hidden",
									flexDirection: "row",
									width: "100%",
									height: 32,
									backgroundColor: "#00f",
									// zIndex: 100
								}}>
									<Text style={{
									top: 6,
									left: 16,
									position: "absolute",
									fontSize: 16,
									fontWeight: "bold",
									color: "#ffffff",
									zIndex: 1000
								}}>
								{"可租  " + (stationBike.bikes)}
									</Text>

									<Text style={{
									top: 6,
									right: 16,
									position: "absolute",
									fontSize: 16,
									fontWeight: "bold",
									color: "#000000",
									zIndex: 1000
								}}>
								{"空位 " + (stationBike.total -  stationBike.bikes)}
									</Text>

									<View style={{
									flexDirection: "row",
									width: (WIDTH - 80) * ((stationBike.bikes) / (stationBike.total)),
									height: 32,
									backgroundColor: "#ff0076"
								}}/>
									<View style={{
									flexDirection: "row",
									width: (WIDTH - 80) * ((stationBike.total -  stationBike.bikes) / (stationBike.total)),
									height: 32,
									backgroundColor: "#d2d2d2"
								}}/>

									</View>

									: <></>}


							</View>
						</View>
					</Actionsheet.Content>
				</Actionsheet>

				<Box flex={1}>
					<MapView
						onRegionChangeComplete={onRegionChangeComplete}
						initialRegion={region}
						style={{flex: 1}}
						provider="google"
						customMapStyle={mapStyle}
					>
						{(zoomRatio > 0.10) && metro ? metro.map((site) => (
							<Marker
								zIndex={1000}

								tracksViewChanges={false}
								coordinate={{latitude: site.latitude, longitude: site.longitude}}
								key={`${site.id}${site.line}`}
								title={site.name}
								// description={site.address}
								onPress={() => {
									onOpen()
									setStation({
										type: "mrt",
										title: site.name,
										description: site.address,
										lat: site.latitude,
										lon: site.longitude,
									})
								}}
							>

								<Center height={15} width={15} bg={site.line === "南港、板橋、土城線" ? "#0095ff" :
									site.line === "中和、蘆洲、新莊線" ? "#ffd974" :
										site.line === "淡水、信義線" ? "#ff517a" :
											site.line === "文山內湖線" ? "#d5ae82" :
												site.line === "小南門、新店線" ? "#13ff00" : "red"} borderRadius={60} p={1.5}
								        borderWidth={3}>
									<MaterialIcons name={"train"} size={24} color="black"/>
								</Center>

							</Marker>
						)) : null}

						{(zoomRatio > 0.25) && ubikeData ? ubikeData.data.map((site) => (
							<Marker
								tracksViewChanges={false}
								coordinate={{latitude: site.lat, longitude: site.lng}}
								key={`${site.sno}`}
								title={site.sna}
								description={site.address}
								onPress={() => {
									onOpen()
									setStation({
										type: "bike",
										title: site.sna,
										description: site.ar,
										lat: site.lat,
										lon: site.lng,
										slot: {
											available: site.sbi,
											empties: site.bemp
										}
									})

									setStationBike({
										total: site.tot,
										bikes: site.sbi
									})
								}}
							>

								<Center bg={"white"} opacity={.5} borderRadius={60} p={1.5}
								        borderWidth={3}>
									<FontAwesome5 name={"bicycle"} size={20} color="black"/>
								</Center>

							</Marker>
						)) : null}

					</MapView>

				</Box>
			</NativeBaseProvider>
		</SafeAreaProvider>
	);
}

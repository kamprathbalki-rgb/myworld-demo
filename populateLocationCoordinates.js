const axios = require('axios')

require('dotenv').config()

const connectDB = require('./config/db')

const LocationMaster = require('./models/LocationMaster')

async function run() {

    try {

        await connectDB()

const locations =
    await LocationMaster.find({
        $or: [
            { lat: { $exists: false } },
            { lng: { $exists: false } }
        ]
    })

        console.log(
            'Locations found:',
            locations.length
        )

        for (const loc of locations) {

            try {

const searchText =
    loc.pincode +
    ', Maharashtra, India'

                console.log(
                    'Searching:',
                    searchText
                )

                const response = await axios.get(
                    'https://nominatim.openstreetmap.org/search',
                    {
                        params: {
                            q: searchText,
                            format: 'json',
                            limit: 1
                        },
                        headers: {
                            'User-Agent':
                            'MyWorld CRM'
                        }
                    }
                )

                if (
                    response.data &&
                    response.data.length > 0
                ) {

loc.lat = Number(response.data[0].lat)

loc.lng = Number(response.data[0].lon)

await loc.save()

console.log(
    'Updated:',
    loc.officeName,
    loc.lat,
    loc.lng
)

                } else {

                    console.log(
                        'Not Found:',
                        loc.officeName
                    )

                }

                // Nominatim usage policy
                // avoid rapid-fire requests

                await new Promise(resolve =>
                    setTimeout(resolve, 1200)
                )

            } catch (err) {

                console.log(
                    'Failed:',
                    loc.officeName
                )

            }

        }

        console.log('Completed')

    } catch (err) {

        console.error(err)

    }

}

run()
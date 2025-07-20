import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

export const updateMessage = async (message : {
    device_id : string
    message : string
  }) : Promise<boolean> => {
    if (message.device_id && message.message) {
        try {
            await prisma.chats.create({
                data : {
                    device_id : message.device_id,
                    message_text : message.message
                }
            })

            return true
        } catch (error) {
            console.log(error)
            return false
        }
    }
    return false
  }

export async function getMessageData(last: string | null) : Promise<object | boolean> {
    try {
        let where;
        if (last) {
            where = {
                createAt : {
                    gt: last
                }
            }
        }
        const data =  await prisma.chats.findMany({
            where, orderBy : {
                createAt : 'asc'
            }
        })
        return data
        
    } catch (error) {
        console.log(error)
        return false
    }
    return false
}
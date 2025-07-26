import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

export const deleteMessage = async () => {
    return await prisma.chats.deleteMany();
}

export const updateMessage = async (message : {
    device_id : string
    message : string | undefined
    reply_id : string | undefined,
    reply_text : string | undefined,
    message_media : string | undefined
  }) : Promise<boolean> => {
    if (message.device_id && message.message) {
        try {
            await prisma.chats.create({
                data : {
                    device_id : message.device_id,
                    message_text : message.message,
                    reply_id : message.reply_id,
                    message_media : message.message_media,
                    reply_text : message.reply_text
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
                createAt : 'desc'
            }, take : 100 , skip : 0
        })
        return data.reverse()
        
    } catch (error) {
        console.log(error)
        return false
    }
    return false
}